
<!-- toc -->

- [Alias](#alias)
  - [Black](#black)
  - [Flake8](#flake8)
  - [Hadolint](#hadolint)
  - [Mypy](#mypy)
  - [Pylint](#pylint)
  - [Pytest](#pytest)
  - [Sphinx](#sphinx)
- [Makefile rules](#makefile-rules)

<!-- tocstop -->

# Alias

## Black

```
alias my_black="docker run --rm -ti --name=black --workdir=/app --volume ${PWD}:/app usefull-containers/black:latest bash -c 'black --config=./black.toml /app/**/*.py'"
```

## Flake8

```
alias my_flake8="docker run --rm -ti --name=flake8 --workdir=/app --volume ${PWD}:/app usefull-containers/flake8:latest bash -c 'flake8 --config=./setup.cfg /app/**/*.py'"
```

## Hadolint

```
alias my_hadolint="docker run --rm -ti --name=hadolint --workdir=/app --volume ${PWD}: usefull-containers/hadolint:latest bash -c '\`find . -name '*.[D-d]ockerfile' -name 'Dockerfile'\`'"
```

## Mypy

```
alias my_mypy="docker run --rm -ti --name=mypy --workdir=/app --volume ${PWD}:/app usefull-containers/mypy:latest"
```

## Pylint

```
alias my_pylint="docker run --rm -ti --name=pylint --workdir=/app --volume ${PWD}:/app usefull-containers/pylint:latest bash -c 'pylint --rcfile=./setup.cfg /app/**/*.py'"
```

## Pytest

```
alias my_pytest="docker run --rm -ti --name=pytest --workdir=/app --volume ${PWD}:/app usefull-containers/pytest:latest bash -c 'pytest --rcfile=./setup.cfg'"
```

## Sphinx

```
alias my_sphinx="docker run --rm -ti --name=sphinx --workdir=/app --volume ${PWD}:/app usefull-containers/sphinx:latest bash"
```

# Makefile rules

<!-- START makefile-doc -->
```
$ make help
make[1]: Entering directory '/mnt/d/drive/repos/usefull-containers'
Variables:
 - "service_name" is a docker-compose service name or a list of services separate by space as string ()


target                                             help                                                                             usage
------                                             ----                                                                             ----
build                                               Build project                                                                    make build [service_name#{service_name}]
build-parallel                                      Build project parallel                                                           make build-parallel [service_name#{service_name}]
clean                                               clean project
down                                                Down project containers                                                          make down
hadolint                                            lint dockerfiles                                                                 make hadolint
help                                                This help dialog.                                                                make help
logs                                                display logs
logs-f                                              display logs with follow
logs-tail                                           display logs tail                                                                [tail#`echo ${tail}`]
pre-commit                                          run localy precommit
prune                                               remove service on the host and prune volume image and network unused
start                                               Start project containers                                                         [service_name#{service_name}]
status                                              display status of all service
stop                                                Start project containers                                                         [service_name#{service_name}]
up-detach                                           Up project containers                                                             [service_name#{service_name}]
upgradable-packages                                 list outdated package in service
up                                                  Up project containers                                                            [service_name#{service_name}]
make[1]: Leaving directory '/mnt/d/drive/repos/usefull-containers'
```
<!-- END makefile-doc -->
