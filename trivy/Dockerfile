FROM aquasec/trivy:0.61.0

WORKDIR /app

ENTRYPOINT ["trivy"]
CMD ["fs", "--exit-code", "1", "--severity", "HIGH,CRITICAL", "."]
