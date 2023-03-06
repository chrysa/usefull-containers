
<!-- toc -->

    * [Black](#black)
        + [Alias](#alias)
        + [Base image](#base-image)
    * [Flake8](#flake8)
        + [Alias](#alias-1)
        + [Base image](#base-image-1)
        + [Packages](#packages)
    * [Hadolint](#hadolint)
        + [Alias](#alias-2)
        + [Base image](#base-image-2)
    * [Mypy](#mypy)
        + [Alias](#alias-3)
        + [Base image](#base-image-3)
        + [Packages](#packages-1)
    * [Pre-commit](#pre-commit)
        + [Alias](#alias-4)
        + [Base image](#base-image-4)
        + [Packages](#packages-2)
    * [Pylint](#pylint)
        + [Alias](#alias-5)
        + [Base image](#base-image-5)
        + [Packages](#packages-3)
    * [Pytest](#pytest)
        + [Alias](#alias-6)
        + [Base image](#base-image-6)
        + [Packages](#packages-4)
    * [Python Dev](#python-dev)
        + [Base image](#base-image-7)
        + [Packages](#packages-5)
    * [Reorder Python Imports](#reorder-python-imports)
        + [Alias](#alias-7)
        + [Base image](#base-image-8)
        + [Packages](#packages-6)
    * [Sphinx](#sphinx)
        + [Alias](#alias-8)
        + [Base image](#base-image-9)
        + [Packages](#packages-7)

- [Makefile rules](#makefile-rules)

<!-- tocstop -->

## Black

### Alias

```
alias my_black="docker run --rm -ti --name=black --workdir=/app --volume ${PWD}:/app chrys4/black:latest"
```

### Base image

pyfound/black:23.1.0

## Flake8

### Alias

```
alias my_flake8="docker run --rm -ti --name=flake8 --workdir=/app --volume ${PWD}:/app chrys4/flake8:latest $@"
```

### Base image

  python:3.11-alpine

### Packages

- flake8==6.0.0
- flake8-black==0.3.6
- flake8-html==0.4.3
- flake8-junit-report==2.1.0
- flake8-mypy==17.8.0

## Hadolint

### Alias

```
alias my_hadolint="docker run --rm -ti --name=hadolint --workdir=/app --volume ${PWD}: chrys4/hadolint:latest bash -c '\`find . -name '*.[D-d]ockerfile' -name 'Dockerfile'\`'"
```

### Base image

  hadolint/hadolint:latest-debian

## Mypy

### Alias

```
alias my_mypy="docker run --rm -ti --name=mypy --workdir=/app --volume ${PWD}:/app chrys4/mypy:latest $@"
```

### Base image

  python:3.11-alpine

### Packages

- mypy==1.0.1
- junit-xml==1.9

## Pre-commit

### Alias

```
alias my_pre_commit="docker run --rm -ti --name=mypy --workdir=/app --volume ${PWD}:/app chrys4/pre-commit:latest $@"
```

### Base image

  python:3.11-slim

### Packages

- pre-commit==3.0.4

## Pylint

### Alias

```
alias my_pylint="docker run --rm -ti --name=pylint --workdir=/app --volume ${PWD}:/app chrys4/pylint:latest $@"
```

### Base image

  python:3.11-alpine

### Packages

- pylint==2.16.2
- pylint-junit==0.3.2
- pylint-report==2.4.0

## Pytest

### Alias

```
alias my_pytest="docker run --rm -ti --name=pytest --workdir=/app --volume ${PWD}:/app chrys4/pytest:latest pytest --rcfile=./setup.cfg $@"
```

### Base image

  python:3.11-alpine

### Packages

- faker==17.0.0
- mock==5.0.1
- pytest==7.2.1
- pytest-benchmark==4.0.0
- pytest-cov==4.0.0
- pytest-depends==1.0.1
- pytest-func-cov==0.2.3
- pytest-html==3.2.0
- pytest-mock==3.10.0

## Python Dev

### Base image

  python:3.11-slim

### Packages

- ipython==8.10.0
- ipdb==0.13.9
- prompt-toolkit==3.0.37

## Reorder Python Imports

### Alias

```
alias my_reorder="docker run --rm -ti --name=reorder-python-imports --workdir=/app --volume ${PWD}:/app chrys4/reorder-python-imports:latest reorder-python-imports $@"
```

### Base image

  python:3.11-alpine

### Packages

- reorder-python-imports==3.9.0

## Sphinx

### Alias

```
alias my_sphinx="docker run --rm -ti --name=sphinx --workdir=/app --volume ${PWD}:/app chrys4/sphinx:latest bash $@"
```

### Base image

  python:3.11-alpine

### Packages

- graphviz==0.20.1
- recommonmark==0.7.1
- sphinx==6.1.3
- sphinx-rtd-theme==1.2.0

# Makefile rules

<!-- START makefile-doc -->
```
$ make help
Variables:
	- "service_name" is a docker-compose service name or a list of services separate by space as string ()


target                                             help                                                                             usage
------                                             ----                                                                             ----
build                                               Build project                                                                    build [service_name#{service_name}]
down                                                Down project containers                                                          down
get-from-remote                                     get source from ducal server
hadolint                                            lint dockerfiles                                                                 hadolint
help                                                This help dialog.                                                                make help
logs                                                display logs
logs-f                                              display logs with follow
logs-tail                                           display logs tail                                                                [tail#`echo ${tail}`]
pre-commit                                          run localy precommit
prune                                               remove service on the host and prune volume image and network unused
remote-connect                                      connect to ducal server
remote-get                                          get source from ducal server
remote-send                                         send source to ducal server
send-to-remote                                      send source to ducal server
start                                               Start project containers                                                         [service_name#{service_name}]
status                                              display status of all service
stop                                                Start project containers                                                         [service_name#{service_name}]
tag-latest                                          tag services as latest                                                           make tag-latest
up-detach                                           Up project containers                                                             [service_name#{service_name}]
upgradable-packages                                 list outdated package in service
up                                                  Up project containers                                                            [service_name#{service_name}]
```
<!-- END makefile-doc -->
