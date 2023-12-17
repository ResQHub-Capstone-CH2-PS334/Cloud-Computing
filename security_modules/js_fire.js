const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { initializeApp, cert } = require('firebase-admin/app')
const { FireError } = require('./js_errorHandler')
const __serviceAccount = require('./keys/key-firestore.json')

initializeApp({
  credential: cert(__serviceAccount)
})

const fire = (col, doc = null) => {
  const headFunc = 'fire'
  const __get = async (key = null) => {
    const func = headFunc + '.__get'
    if (key === null) {
      // returns a document metadata
      return await getFirestore().collection(col).doc(doc).get()
    }
    if (!(await getFirestore().collection(col).doc(doc).get()).exists) {
      throw new FireError(func, 'documentMissing')
    }
    if (typeof (key) === 'object') {
      if (Array.isArray(key)) {
        const data = {}
        for (let i = 0; i < key.length; i++) {
          data[key[i]] = (await getFirestore().collection(col).doc(doc).get()).data()[key[i]]
        }
        return data
      }
      const content = []
      const docId = []

      const nodes = await getFirestore().collection(col).where(key.key, key.operator, key.value).get()
      nodes.forEach((node) => {
        content.push(node.data())
        docId.push(node.id)
      })

      // returns a list of keys of the corresponding document
      return { docId, content }
    }
    // returns keys and values of a specific document
    return (await getFirestore().collection(col).doc(doc).get()).data()[key]
  }
  const __list = async () => {
    const d = []
    const nodes = await getFirestore().collection(col).get()
    nodes.forEach(node => d.push(node.data()))

    // returns all documents' keys and values
    return d
  }
  const __write = async (content, option) => {
    // writes a content (object) into a document
    return await getFirestore().collection(col).doc(doc).set(content, option)
  }
  const __delete = async (key) => {
    // delete a document (if key is null) or a field
    if (doc === null) return -1 // collection deletion is not allowed
    if (key === null) {
      return (await getFirestore().collection(col).doc(doc).delete())
    }
    return (await getFirestore().collection(col).doc(doc).update({
      [key]: FieldValue.delete()
    }))
  }
  return {
    get: __get,
    write: __write,
    delete: __delete,
    list: __list
  }
}

module.exports = fire
