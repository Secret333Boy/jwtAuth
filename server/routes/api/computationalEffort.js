module.exports = async (func, ms) =>
  new Promise((resolve, reject) => {
    try {
      const data = func();
      setTimeout(() => {
        resolve(data);
      }, ms);
    } catch (e) {
      reject(e);
    }
  });
