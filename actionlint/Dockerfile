FROM rhysd/actionlint:1.7.12

LABEL maintainer=""
LABEL description="Static checker for GitHub Actions workflow files"

WORKDIR /app

ENTRYPOINT ["actionlint"]
CMD [".github/workflows/"]
