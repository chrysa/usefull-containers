# usefull-containers

add to your `~/.profile`

```bash
alias black="docker run --rm -ti --name=black --volume ${PWD}:/app usefull-containers/black:latest bash -c 'black --config=./black.toml /appp/**/*.py"
alias flake8="docker run --rm -ti --name=flake8 --volume ${PWD}:/app usefull-containers/flake8:latest bash -c 'flake8 --config=./setup.cfg /appp/**/*.py"
alias hadolint="docker run --rm -ti --name=hadolint --volume ${PWD}: usefull-containers/hadolint:latest bash -c '`find . -name '*.[D-d]ockerfile' -name 'Dockerfile'`"
alias mypy="docker run --rm -ti --name=mypy --volume ${PWD}:/app usefull-containers/mypy:latest bash -c 'mypy --config-file=./setup.cfg /app/**/*.py"
alias pylint="docker run --rm -ti --name=pylint --volume ${PWD}:/app usefull-containers/pylint:latest bash -c 'pylint --rcfile=./setup.cfg /app/**/*.py"
alias pytest="docker run --rm -ti --name=pytest --volume ${PWD}:/app usefull-containers/pytest:latest bash -c 'pytest --rcfile=./setup.cfg"
alias sphinx="docker run --rm -ti --name=sphinx --volume ${PWD}:/app usefull-containers/sphinx:latest bash
```
