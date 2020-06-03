let promisifyWithContext = (fn: any, ctx: any): any => (...args: any[]) =>
  new Promise((resolve, reject) => {
    let cb = (err: Error | null, res: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    };
    fn.apply(ctx, [...args, cb]);
  });

export default promisifyWithContext;
