const mockRequest = (data = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    ip: "127.0.0.1",
    ...data,
  };
};

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

module.exports = {
  mockRequest,
  mockResponse,
};
