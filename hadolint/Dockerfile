FROM  hadolint/hadolint:latest-debian
COPY .hadolint.yaml /app/.hadolint.yaml
WORKDIR  /app
CMD ["hadolint","Dockerfile","--config=/app/.hadolint.yaml","-"]
