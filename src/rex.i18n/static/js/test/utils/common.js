function successfulPromise(promise, done, tests) {
  promise.then(
    function (result) {
      tests(result);
      done();
    },

    function (error) {
      expect('onFullfilled').toBe('called, but onRejected was');
      done();
    }
  ).then(
    null,
    function (error) {
      expect(error).toBeNull();
      done();
    }
  );
}


function failedPromise(promise, done, tests) {
  promise.then(
    function (result) {
      expect('onRejected').toBe('called, but onFulfilled was');
      done();
    },

    function (error) {
      tests(error);
      done();
    }
  ).then(
    null,
    function (error) {
      expect(error).toBeNull();
      done();
    }
  );
}

