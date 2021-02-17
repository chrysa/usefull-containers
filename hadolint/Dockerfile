FROM  hadolint/hadolint:latest-debian
ADD .hadolint.yaml /app/.hadolint.yaml
WORKDIR  /app
CMD ["hadolint","Dockerfile","--config=/app/.hadolint.yaml","-"]
