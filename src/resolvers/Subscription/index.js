const cloudInitOutputLogUpdate = {
  subscribe: (root, args, context) => {
    return context.pubsub.asyncIterator(`cloudInitOutputLogUpdate`)
  },
}

module.exports = {
  cloudInitOutputLogUpdate,
}
