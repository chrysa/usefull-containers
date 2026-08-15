# Deep-dive — `chrysa/usefull-containers`

**Purpose (1 sentence):** A collection of ready-to-use, disposable Docker images for Python
code quality / testing / security tooling (black, ruff, mypy, pytest, bandit, trivy, hadolint,
actionlint, yamllint…) plus a few local application base images (Django/DRF, Flask, Alembic
migrations, an SSE `live-platform` dashboard), run one-shot against `${PWD}:/app` so the host
needs no local toolchain.

**Nature:** This is a well-trodden category ("dockerized dev tools"). Strong external references
exist — no need to force 10. The 4 below cover the two real design axes of the repo: (a) the
container-per-tool collection + run ergonomics, and (b) the multistage-per-linter + Makefile-CI
build pattern. The `live-platform` SSE subcomponent is minor and internal; not worth a forced ref.

---

## jessfraz/dockerfiles

- **owner/repo:** jessfraz/dockerfiles
- **stars:** ~13.9k
- **activity:** long-lived, 1,596 commits, CI still green (mature, low churn)
- **licence:** **MIT** — copiable
- **pattern file/module:** every `*/Dockerfile` carries the run command as a top-of-file comment;
  aliases centralised out-of-band in `jessfraz/dotfiles/.dockerfunc`
- **mechanism:** one image per CLI tool, no host install; the canonical invocation
  (`docker run --rm -v $(pwd):/root … tool`) is documented *in the Dockerfile itself*, and a
  companion shell file turns each into a shell function so `black foo.py` transparently runs the
  container. This is exactly the `alias my_black="docker run … chrys4/black"` ergonomic in this repo.
- **portable snippet (shell-function form, better than a static README alias):**
  ```sh
  # .dockerfunc-style wrapper: transparent containerised tool
  ruff() {
    docker run --rm -i \
      --name ruff-$$ \
      -v "$(pwd)":/app -w /app \
      -u "$(id -u):$(id -g)" \
      chrys4/ruff:latest "$@"
  }
  # now `ruff check .` runs the container as if ruff were installed
  ```
- **integration steps:** (1) ship a `dockerfunc.sh` (or a `make alias-install`) that emits these
  wrappers for every published `chrys4/*` image, so users get `ruff`/`black`/`mypy` transparently
  instead of copy-pasting README aliases; (2) keep the run command as a comment at the top of each
  service Dockerfile (jessfraz convention) — it survives even when the README drifts.
- **gotchas:** jessfraz images run as root and mount `/root`; this repo's standards require the
  host UID (`-u $(id -u):$(id -g)`) and `/app` for any bind-mount image — keep that, do not copy
  the root-user default. `$$`/`$@` quoting matters for filenames with spaces.

---

## cytopia/docker-black (+ docker-mypy, docker-pylint, docker-file-lint — same family)

- **owner/repo:** cytopia/docker-black (representative of ~a dozen sibling repos)
- **stars:** ~24 (per-repo; the *family* is widely used via Docker Hub `cytopia/*`)
- **activity:** nightly automated rebuilds against multiple upstream tool versions
- **licence:** **MIT**, © 2019 cytopia — copiable
- **pattern file/module:** `Dockerfile` (Alpine + multistage) + `Makefile` (build/test/tag/push)
- **mechanism:** the single most relevant reference. Each linter is an **Alpine multistage build**
  — a `builder` stage pip-installs the tool + compiles wheels, the final stage copies only the
  installed site-packages → tiny image. Nightly CI rebuilds against **pinned upstream versions**
  and pushes version-tagged + `latest` to Docker Hub. Run contract: `docker run --rm -v
  $(pwd):/data cytopia/black main.py` (workdir `/data`). This is the "reproducible tool in CI"
  thesis of `usefull-containers`, done at fleet scale with one repo per tool.
- **portable snippet (multistage Alpine linter — directly applicable to ruff/mypy/bandit here):**
  ```dockerfile
  FROM python:3.13-alpine AS builder
  ARG TOOL_VERSION=0.9.10
  RUN pip install --no-cache-dir --prefix=/install "ruff==${TOOL_VERSION}"

  FROM python:3.13-alpine
  COPY --from=builder /install /usr/local
  WORKDIR /app
  # non-root for bind-mounted host code (chrysa standard)
  RUN adduser -D -u 1000 app
  USER app
  ENTRYPOINT ["ruff"]
  CMD ["check", "."]
  ```
- **integration steps:** (1) this repo already single-stages most tool images; adopting the
  builder→slim split shrinks images and separates build deps from runtime; (2) copy cytopia's
  `ARG TOOL_VERSION` + build-arg-driven tagging so the Docker Hub tag *is* the tool version
  (better than a floating `:latest`); (3) mirror the nightly-rebuild workflow to pick up base-image
  CVE patches without bumping the app version — this maps onto the chrysa standard "container
  versioned separately from the app it hosts".
- **gotchas:** Alpine musl breaks tools needing manylinux wheels (numpy-adjacent, some mypy C
  extensions) — cytopia occasionally falls back to Debian slim; expect the same for a few tools
  here. Workdir differs (`/data` vs this repo's `/app`) — pick one and enforce it fleet-wide.

---

## datastack-net/dockerized

- **owner/repo:** datastack-net/dockerized
- **stars:** ~1.3k
- **activity:** active; 302 commits, Go codebase
- **licence:** **MIT** — copiable (but it's a Go tool, so *adopt the pattern*, don't vendor code)
- **pattern file/module:** `docker-compose.yml` (default command catalogue) + `COMPOSE_FILE` /
  `dockerized.env` override chain
- **mechanism:** commands are declared as **compose services**, and a launcher resolves
  `dockerized <cmd>` to the right service, with per-tool version pinning via env
  (`PYTHON_VERSION`, `NODE_VERSION`, or ad-hoc `dockerized python:3.12`). It falls back to the
  150+ jessfraz images. Directly relevant because `usefull-containers` *already* keeps its app
  images in a root `docker-compose.yaml` selected by `make up service=<name>` — datastack shows
  how to extend that into a first-class, version-overridable CLI dispatcher for the *tooling*
  images too (which currently only get README aliases, not a compose entry).
- **portable snippet (compose service as a runnable tool + Makefile dispatch):**
  ```yaml
  # docker-compose.tools.yaml
  services:
    ruff:
      image: chrys4/ruff:${RUFF_VERSION:-latest}
      volumes: [".:/app"]
      working_dir: /app
      user: "${UID:-1000}:${GID:-1000}"
  ```
  ```make
  tool:  ## run a tooling container: make tool name=ruff args="check ."
  	@docker compose -f docker-compose.tools.yaml run --rm $(name) $(args)
  ```
- **integration steps:** (1) add a `docker-compose.tools.yaml` cataloguing the `chrys4/*` images
  so they gain the same `make`-driven UX as the app images; (2) expose `TOOL_VERSION` env per
  service for reproducible pinning; (3) optionally a thin `usefull` wrapper script for
  `usefull ruff check .`.
- **gotchas:** datastack's launcher assumes root-ish mounts and Docker socket availability; keep
  the chrysa non-root + no-privileged-socket rules. Don't import its Go module — reimplement the
  (trivial) dispatch in Make/shell to avoid a Go build dependency in a Python-tooling repo.

---

## aquasec/trivy & hadolint/hadolint & rhysd/actionlint (upstream base images — NOT references to copy)

- **licences:** Trivy **Apache-2.0**, hadolint **GPL-3.0**, actionlint **MIT**.
- These are the **upstream binaries this repo wraps** (`FROM aquasec/trivy:0.61.0`, etc.), not
  design references. Flag: **hadolint is GPL-3.0** — fine to *use as an unmodified base image and
  invoke* (aggregation, no copyleft obligation on your Dockerfile), but do **not** vendor/derive
  from hadolint source. Trivy (Apache-2.0) and actionlint (MIT) are unrestricted.
- **gotcha:** pin these bases by digest, not the floating tags the README currently shows
  (`hadolint/hadolint:latest-debian`, `rhysd/actionlint:latest`) — the chrysa standard forbids
  bare `:latest` bases, and a moving upstream tag silently changes your published image.

---

## Cross-cutting takeaways

1. **The whole category is MIT/Apache** (jessfraz, cytopia, datastack) → the *patterns* are freely
   copiable; the only copyleft in scope is **hadolint (GPL-3.0)**, which is consumed as an
   unmodified base image (aggregation, safe) — never derive from its source.
2. **Highest-value borrow = cytopia's multistage + build-arg-versioned + nightly-rebuild** model:
   smaller images, tool-version-as-tag, and base-CVE patching decoupled from app version (aligns
   with the chrysa "container versioned separately from the app" standard).
3. **Second borrow = jessfraz/datastack run ergonomics**: promote the README aliases into shipped
   shell-function wrappers (`dockerfunc.sh`) and/or a `docker-compose.tools.yaml` + `make tool`
   dispatcher, so tooling images get the same first-class UX the app images already have — while
   keeping chrysa's non-root bind-mount + pinned-base rules that all three references ignore.
