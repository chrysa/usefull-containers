<!-- toc -->

- [Alias](#alias)
  - [Black](#black)
    - [Packages](#packages)
  - [Flake8](#flake8)
    - [Packages](#packages-1)
  - [Hadolint](#hadolint)
  - [Mypy](#mypy)
    - [Packages](#packages-2)
  - [Pre-commit](#pre-commit)
    - [Packages](#packages-3)
  - [Pre-commit](#pre-commit-1)
    - [Packages](#packages-4)
  - [Pylint](#pylint)
    - [Packages](#packages-5)
  - [Pytest](#pytest)
    - [Packages](#packages-6)
  - [Sphinx](#sphinx)
    - [Packages](#packages-7)
- [Makefile rules](#makefile-rules)

<!-- tocstop -->

# Alias

## Black

```
alias my_black="docker run --rm -ti --name=black --workdir=/app --volume ${PWD}:/app chrys4/black:latest"
```

### Packages

- black==21.9b0

## Flake8

```
alias my_flake8="docker run --rm -ti --name=flake8 --workdir=/app --volume ${PWD}:/app chrys4/flake8:latest"
```

### Packages

- flake8==3.9.2
- flake8-black==0.2.3
- flake8-html==0.4.1
- flake8-junit-report==2.1.0
- flake8-mypy==17.8.0

## Hadolint

```
alias my_hadolint="docker run --rm -ti --name=hadolint --workdir=/app --volume ${PWD}: chrys4/hadolint:latest bash -c '\`find . -name '*.[D-d]ockerfile' -name 'Dockerfile'\`'"
```

## Mypy

```
alias my_mypy="docker run --rm -ti --name=mypy --workdir=/app --volume ${PWD}:/app chrys4/mypy:latest"
```

### Packages

- mypy==0.910
- junit-xml==1.9

## Pre-commit

```
alias my_pre_commit="docker run --rm -ti --name=mypy --workdir=/app --volume ${PWD}:/app chrys4/pre-commit:latest"
```

### Packages

- mypy==0.910
- junit-xml==1.9

## Pre-commit

```
alias my_pre_commit="docker run --rm -ti --name=mypy --workdir=/app --volume ${PWD}:/app chrys4/pre-commit:latest"
```

### Packages

- pre-commit==2.15.0

## Pylint

```
alias my_pylint="docker run --rm -ti --name=pylint --workdir=/app --volume ${PWD}:/app chrys4/pylint:latest"
```

### Packages

- pylint==2.11.1
- pylint-junit==0.3.2
- pylint-report==0.1.8

## Pytest

```
alias my_pytest="docker run --rm -ti --name=pytest --workdir=/app --volume ${PWD}:/app chrys4/pytest:latest bash -c 'pytest --rcfile=./setup.cfg'"
```

### Packages

- faker==8.16.0
- mock==4.0.3
- pytest==6.2.5
- pytest-benchmark==3.4.1
- pytest-cov==3.0.0
- pytest-depends==1.0.1
- pytest-func-cov==0.2.3
- pytest-html==3.1.1
- pytest-mock==3.6.1

## Sphinx

```
alias my_sphinx="docker run --rm -ti --name=sphinx --workdir=/app --volume ${PWD}:/app chrys4/sphinx:latest bash"
```

### Packages

- graphviz==0.17
- recommonmark==0.7.1
- sphinx==4.2.0
- sphinx-rtd-theme==1.0.0

# Makefile rules

<!-- START makefile-doc -->
```
$ make help
Variables:
 - "service_name" is a docker-compose service name or a list of services separate by space as string ()


target                                             help                                                                             usage
------                                             ----                                                                             ----
build                                               build service
build-parallel                                      build service  in parallel
down                                                Down project containers                                                          down
hadolint                                            lint dockerfiles                                                                 hadolint
help                                                This help dialog.                                                                make help
logs                                                display logs
logs-f                                              display logs with follow
logs-tail                                           display logs tail                                                                [tail#`echo ${tail}`]
pre-commit                                          run localy precommit
prune                                               remove service on the host and prune volume image and network unused
start                                               Start project containers                                                         [service_name#{service_name}]
status                                              display status of all service
stop                                                Start project containers                                                         [service_name#{service_name}]
tag-latest                                          tag services as latest                                                           make tag-latest
up-detach                                           Up project containers                                                             [service_name#{service_name}]
upgradable-packages                                 list outdated package in service
up                                                  Up project containers                                                            [service_name#{service_name}]
```
<!-- END makefile-doc -->
