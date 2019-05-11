pipeline {

  agent any

  stages {  

    stage('Install Packages') {
      tools {
        nodejs 'NodeJS 8'
      }
      steps {
        timeout(10) {
          retry(3) {
            sh 'npm install --unsafe-perm'
          }
        }
      }
    }

    stage('Test node 8') {
      tools {
        nodejs 'NodeJS 8'
      }
      steps {
        timeout(1) {
          retry(3) {
            sh 'node --version'
            sh 'npm --version'
            sh 'npm test'
          }
        }
      }
    }

    stage('Test node 10') {
      tools {
        nodejs 'NodeJS 10'
      }
      steps {
        timeout(1) {
          retry(3) {
            sh 'node --version'
            sh 'npm --version'
            sh 'npm test'
          }
        }
      }
    }

    stage('Test node 11') {
      tools {
        nodejs 'NodeJS 11'
      }
      steps {
        timeout(1) {
          retry(3) {
            sh 'node --version'
            sh 'npm --version'
            sh 'npm test'
          }
        }
      }
    }

    stage('Test node 12'){
      tools {
        nodejs 'NodeJS 12'
      }
      steps {
        timeout(1) {
          retry(3) {
            sh 'node --version'
            sh 'npm --version'
            sh 'npm test'
          }
        }
      }
    }

    stage('Code Coverage') {
      steps {
        //cobertura autoUpdateHealth: false, autoUpdateStability: false, classCoverageTargets: '80, 0, 40', coberturaReportFile: 'output/coverage/jest/cobertura-coverage.xml', conditionalCoverageTargets: '80, 0, 40', enableNewApi: true, failUnhealthy: false, failUnstable: false, fileCoverageTargets: '80, 0, 40', lineCoverageTargets: '80, 0, 40', maxNumberOfBuilds: 0, methodCoverageTargets: '80, 0, 40', onlyStable: false, packageCoverageTargets: '80, 0, 40', sourceEncoding: 'ASCII', zoomCoverageChart: false
        publishCoverage adapters: [coberturaAdapter('output/coverage/jest/cobertura-coverage.xml')], sourceFileResolver: sourceFiles('STORE_LAST_BUILD')
      }
    }

  }

  post {
    always {
      cleanWs()
    }
  }

}