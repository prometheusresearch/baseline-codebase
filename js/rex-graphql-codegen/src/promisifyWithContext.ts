let promisifyWithContext = (fn, ctx): any => (...args) =>
  new Promise((resolve, reject) => {
    let cb = (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    };
    fn.apply(ctx, [...args, cb]);
  });

export default promisifyWithContext;
