pipeline {

  agent any

  stages {  

    stage('Install Packages') {
      tools {
        nodejs 'NodeJS 8'
      }
      steps {
        timeout(15) {
          sh 'npm install'
          sh 'npm run installdev'
        }
      }
    }

    stage('Test node 8') {
      tools {
        nodejs 'NodeJS 8'
      }
      steps {
        timeout(5) {
          retry(3) {
            sleep 10
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
        timeout(5) {
          retry(3) {
            sleep 10
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
        timeout(5) {
          retry(3) {
            sleep 10
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
      steps{
        timeout(5) {
          retry(3) {
            sleep 10
            sh 'node --version'
            sh 'npm --version'
            sh 'npm test'
          }
        }
      }
    }

  }

  post {
    always {
      cleanWs()
    }
  }

}