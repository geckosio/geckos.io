pipeline {

  agent none

  stages {
    stage('Run Tests') {
      parallel {

        stage('Test on Node.js 8') {
          agent {
            dockerfile {
              filename 'node8.Dockerfile'
              dir 'dockerfiles'
            }
          }
          steps {
            timeout(20) {
              retry(2) {
                sh 'node --version'
                sh 'npm --version'
                sh 'npm install --unsafe-perm'
                sh 'npm test'
                publishCoverage adapters: [coberturaAdapter('output/coverage/jest/cobertura-coverage.xml')], sourceFileResolver: sourceFiles('STORE_LAST_BUILD')
              }
            }
          }
        }

        stage('Test on Node.js 10') {
          agent {
            dockerfile {
              filename 'node10.Dockerfile'
              dir 'dockerfiles'
            }
          }
          steps {
            timeout(20) {
              retry(2) {
                sh 'node --version'
                sh 'npm --version'
                sh 'npm install --unsafe-perm'
                sh 'npm test'
                publishCoverage adapters: [coberturaAdapter('output/coverage/jest/cobertura-coverage.xml')], sourceFileResolver: sourceFiles('STORE_LAST_BUILD')
              }
            }
          }
        }

        stage('Test on Node.js 11') {
          agent {
            dockerfile {
              filename 'node11.Dockerfile'
              dir 'dockerfiles'
            }
          }
          steps {
            timeout(20) {
              retry(2) {
                sh 'node --version'
                sh 'npm --version'
                sh 'npm install --unsafe-perm'
                sh 'npm test'
                publishCoverage adapters: [coberturaAdapter('output/coverage/jest/cobertura-coverage.xml')], sourceFileResolver: sourceFiles('STORE_LAST_BUILD')
              }
            }
          }
        }

        stage('Test on Node.js 12') {
          agent {
            dockerfile {
              filename 'node12.Dockerfile'
              dir 'dockerfiles'
            }
          }
          steps {
            timeout(20) {
              retry(2) {
                sh 'node --version'
                sh 'npm --version'
                sh 'npm install --unsafe-perm'
                sh 'npm test'
                publishCoverage adapters: [coberturaAdapter('output/coverage/jest/cobertura-coverage.xml')], sourceFileResolver: sourceFiles('STORE_LAST_BUILD')
              }
            }
          }
        }

      }
    }
  }

}