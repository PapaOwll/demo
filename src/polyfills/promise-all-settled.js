if (typeof Promise.allSettled !== 'function') {
  Promise.allSettled = function (promises) {
    return Promise.all(
      [...promises].map((promise) =>
        Promise.resolve(promise).then(
          (value) => ({ status: 'fulfilled', value }),
          (error) => ({ status: 'rejected', reason: error })
        )
      )
    )
  }
}
