exports.handler = async (event) => {
    console.log("Hello from the hello function!");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Hello, world!' }),
    };
  };