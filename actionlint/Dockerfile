FROM rhysd/actionlint:latest

LABEL maintainer=""
LABEL description="Static checker for GitHub Actions workflow files"

WORKDIR /app

ENTRYPOINT ["actionlint"]
CMD [".github/workflows/"]
