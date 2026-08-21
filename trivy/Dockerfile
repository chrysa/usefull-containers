# syntax=docker/dockerfile:1.4

FROM aquasec/trivy:0.74.0

WORKDIR /app

ENTRYPOINT ["trivy"]

CMD ["fs", "--exit-code", "1", "--severity", "HIGH,CRITICAL", "."]
