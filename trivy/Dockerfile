FROM aquasec/trivy:0.69.3

WORKDIR /app

ENTRYPOINT ["trivy"]
CMD ["fs", "--exit-code", "1", "--severity", "HIGH,CRITICAL", "."]
