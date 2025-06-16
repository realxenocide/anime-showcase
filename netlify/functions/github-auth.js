exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      token: process.env.GITHUB_TOKEN
    })
  };
};
