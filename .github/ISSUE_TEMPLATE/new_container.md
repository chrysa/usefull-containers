---
name: "\U0001F4E6 New container proposal"
about: Propose a new Docker container to add to the collection
title: "feat(container): add <tool-name>"
labels: enhancement, new-container
assignees: ""
---

## Tool name

<!-- Name of the tool/library to containerise -->

## Purpose

<!-- What does this tool do? Why is it useful? -->

## Official source

<!-- Link to the tool's repository, docs, or Docker Hub image -->

## Suggested Docker base image

<!-- e.g. python:3.13-alpine, golang:1.22-alpine -->

## Key packages / dependencies

<!-- List the main packages to install -->

## Usage example

```bash
docker run --rm -ti \
  --name=<tool> \
  --volume ${PWD}:/app \
  chrys4/<tool>:latest
```

## Additional context

<!-- Any other information -->
