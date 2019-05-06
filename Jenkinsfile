pipeline {

  agent any

  stages {  

    stage("NodeJS 8"){
      tools {
        nodejs "NodeJS 8"
      }
      steps{
        git 'https://github.com/geckosio/geckos.io'
        sh 'node --version'
        sh 'npm --version'
        sh 'npm install'
        sh 'sleep 1m'
        cleanWs()
      }
    }

    stage("NodeJS 10") {
      tools {
        nodejs "NodeJS 10"
      }
      steps {
        git 'https://github.com/geckosio/geckos.io'
        sh 'node --version'
        sh 'npm --version'
        sh 'npm install'
        sh 'sleep 1m'
        cleanWs()
      }
    }

    stage("NodeJS 11") {
      tools {
        nodejs "NodeJS 11"
      }
      steps {
        git 'https://github.com/geckosio/geckos.io'
        sh 'node --version'
        sh 'npm --version'
        sh 'npm install'
        sh 'sleep 1m'
        cleanWs()
      }
    }

    stage("NodeJS 12") {
      tools {
        nodejs "NodeJS 12"
      }
      steps {
        git 'https://github.com/geckosio/geckos.io'
        sh 'node --version'
        sh 'npm --version'
        sh 'npm install'
        sh 'sleep 1m'
        cleanWs()
      }
    }

  }

  post {
    always {
      cleanWs()
    }
  }

}