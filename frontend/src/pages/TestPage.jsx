// frontend/src/pages/TestPage.jsx


const TestPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
        <h1 className="text-3xl font-bold text-gray-900"> React is Working!</h1>
        <p className="text-gray-600 mt-2">If you see this, the frontend is rendering correctly.</p>
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <p className="text-green-700"> Frontend is successfully connected!</p>
        </div>
      </div>
    </div>
  );
};

export default TestPage;