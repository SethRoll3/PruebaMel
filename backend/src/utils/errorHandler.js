export const handleError = (res, error, defaultMessage) => {
  console.error('Error:', error);
  const statusCode = error.statusCode || 500;
  const message = error.message || defaultMessage;
  res.status(statusCode).json({ message }); 
};