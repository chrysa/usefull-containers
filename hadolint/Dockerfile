# syntax=docker/dockerfile:1.4

FROM  hadolint/hadolint:latest-debian

COPY .hadolint.yaml /app/.hadolint.yaml

WORKDIR  /app

ENTRYPOINT ["hadolint", "--config=/app/.hadolint.yaml"]