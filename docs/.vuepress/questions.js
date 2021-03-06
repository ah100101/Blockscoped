// You can create a json from a question md file by running the following in the dev tools console:
const createJson = () => {
  JSON.stringify(
    Array.from(document.querySelectorAll('h2:not(.answer)')).map((h, i) => {
      return {
        slug: h.id,
        title: h.outerText.replace('# ', ''),
        url: h.baseURI.replace('http://localhost:8080', '') + '#' + h.id,
        categories: Array.from(
          Array.from(document.getElementsByClassName('categories'))[
            i
          ].querySelectorAll('span')
        ).map(s => s.dataset.key),
        difficulty: Array.from(
          Array.from(document.getElementsByClassName('difficulty'))[
            i
          ].querySelectorAll('.rating')
        ).map(r => r.dataset.key)[0]
      }
    })
  )
}

import javascript from './questionData/javascript.json'
import csharp from './questionData/csharp.json'
import css from './questionData/css.json'
import datastructures from './questionData/datastructures.json'
import html from './questionData/html.json'

const questions = {
  javascript,
  csharp,
  css,
  datastructures,
  html
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function dedupe(array) {
  return array.filter((value, index) => array.indexOf(value) === index)
}

const getQuestionList = topicKey => {
  if (!topicKey || !questions[topicKey]) {
    console.error('Invalid topicKey')
    return
  }

  return questions[topicKey]
}

const getQuestionCount = questionRequest => {
  if (!questionRequest || !questionRequest.topics || questionRequest.topics.length <= 0) {
    console.error('Invalid Parameters provided.')
  }
  return new Promise((resolve, reject) => {
    let validTopics = questionRequest.topics.filter(t => !!questions[t])

    if (!validTopics && validTopics.length <= 0) {
      reject('Invalid language provided for question')
    }

    let filteredQuestions = validTopics.reduce((acc, topic) => {
      return acc.concat(JSON.parse(JSON.stringify(questions[topic])))
    }, [])

    if (questionRequest.difficulty && questionRequest.difficulty.length > 0) {
      filteredQuestions = filteredQuestions.filter(
        q1 => questionRequest.difficulty.filter(q2 => q2 === q1.difficulty).length > 0
      )
    }

    if (filteredQuestions.length === 0) {
      resolve(0)
    }

    if (questionRequest.categories && questionRequest.categories.length > 0) {
      filteredQuestions = filteredQuestions.filter(
        q1 => questionRequest.categories.filter(
          c1 => q1.categories.filter(c2 => c1 === c2).length > 0
        ).length > 0
      )
    }

    if (filteredQuestions.length === 0) {
      resolve(0)
    }

    if (window.quiz && window.quiz.length > 0) {
      filteredQuestions = filteredQuestions.filter(
        q => window.quiz.filter(qz => q.slug !== qz.slug).length > 0 
      )
    }

    if (filteredQuestions.length === 0) {
      resolve(0)
    }

    resolve(filteredQuestions.length)
  })
}

const getRandomQuestion = questionRequest => {
  if (!questionRequest || !questionRequest.topics || questionRequest.topics.length <= 0) {
    console.error('Invalid Parameters provided.')
  }
  return new Promise((resolve, reject) => {
    let validTopics = questionRequest.topics.filter(t => !!questions[t])

    if (!validTopics && validTopics.length <= 0) {
      reject('Invalid language provided for question')
    }

    let filteredQuestions = validTopics.reduce((acc, topic) => {
      return acc.concat(JSON.parse(JSON.stringify(questions[topic])))
    }, [])

    if (questionRequest.difficulty && questionRequest.difficulty.length > 0) {
      filteredQuestions = filteredQuestions.filter(
        q1 => questionRequest.difficulty.filter(q2 => q2 === q1.difficulty).length > 0
      )
    }

    if (filteredQuestions.length === 0) {
      reject('No question found after difficulty filter applied')
    }

    if (questionRequest.categories && questionRequest.categories.length > 0) {
      filteredQuestions = filteredQuestions.filter(
        q1 => questionRequest.categories.filter(
          c1 => q1.categories.filter(c2 => c1 === c2).length > 0
        ).length > 0
      )
    }

    if (filteredQuestions.length === 0) {
      reject('No question found after category filter applied')
    }

    if (window.quiz && window.quiz.length > 0) {
      filteredQuestions = filteredQuestions.filter(
        q => window.quiz.filter(qz => q.slug !== qz.slug).length > 0 
      )
    }

    if (filteredQuestions.length === 0) {
      reject('All questions have been asked')
    }

    const randomIndex = getRandomInt(0, filteredQuestions.length - 1)
    const question = filteredQuestions[randomIndex]

    if (question) {
      resolve(question)
    }

    reject('No question found.')
  })
}

const getTopicDifficulties = topic => {
  return new Promise((resolve, reject) => {
    if (!questions[topic]) {
      reject('Invalid topic provided')
    }
    let topicDifficulties = questions[topic].map(q => q.difficulty)
    resolve(dedupe(topicDifficulties))
  })
}

const getTopicCategories = topic => {
  return new Promise((resolve, reject) => {
    if (!questions[topic]) {
      reject('Invalid topic provided')
    }

    let topicCategories = questions[topic]
      .map(q => q.categories)
      .reduce((acc, categories) => {
        let notInAcc = categories.filter(c => acc.filter(a => a === c).length === 0)
        if (notInAcc.length > 0) {
          acc = acc.concat(notInAcc)
        }
        return acc
      }, [])
    resolve(dedupe(topicCategories))
  })
}

const getTopicsDifficulties = topics => {
  let validTopics = topics.filter(topic => !!questions[topic])
  return Promise.all(validTopics.map(topic => getTopicDifficulties(topic)))
    .then(difficulties => {
      let allDifficulties = difficulties.reduce((acc, difficulties) => { 
        acc = acc.concat(difficulties)
        return acc
      }, [])
      return dedupe(allDifficulties)
    })
    .catch(error => {
      console.debug(error)
      return []
    })
}

const getTopicsCategories = topics => {
  return Promise.all(topics.map(topic => getTopicCategories(topic)))
    .then(topicCategories => {
      let combinedCategories = topicCategories.reduce((acc, categories) => {
        acc = acc.concat(categories)
        return acc
      }, [])
      return dedupe(combinedCategories)
    })
    .catch(error => {
      console.debug(error)
      return []
    })
}

const getTotalQuestionCount = () => {
  return getQuestionList('javascript').length 
  + getQuestionList('css').length
  + getQuestionList('html').length
}

export default {
  getRandomQuestion,
  getQuestionCount,
  getQuestionList,
  getTopicsDifficulties,
  getTopicsCategories,
  getTotalQuestionCount
}
