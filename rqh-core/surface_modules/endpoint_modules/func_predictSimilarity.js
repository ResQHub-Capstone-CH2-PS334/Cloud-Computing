const tf = require('@tensorflow/tfjs-node')
const MODELPATH = 'file://surface_modules/endpoint_modules/ml_model_alternative/model.json'

const predictSimilarity = async (__imageBuffers) => {
  const image0 = new Uint8Array(__imageBuffers[0])
  const image1 = new Uint8Array(__imageBuffers[1])

  let tensorImg0 = tf.node.decodeImage(image0, 3, 'int32', true)
  let tensorImg1 = tf.node.decodeImage(image1, 3, 'int32', true)

  tensorImg0 = tf.div(tensorImg0, 255.0)
  tensorImg1 = tf.div(tensorImg1, 255.0)

  tensorImg0 = tf.expandDims(tensorImg0, 0)
  tensorImg1 = tf.expandDims(tensorImg1, 0)

  console.log('YY')
  const model = await tf.loadGraphModel(MODELPATH)
  console.log('XX')
  const result = model.predict([tensorImg0, tensorImg1])
  // result.forEach(async (data) => console.log(await data.data()))
  // console.log(await result.data())

  return await result.data()
}

module.exports = { predictSimilarity }
