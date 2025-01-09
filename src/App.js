import Menu from './pages/Menu';

function App() {
  // 可以从 URL 参数中获取 tableId，这里先写死
  const tableId = 1;
  
  return (
    <div>
      <Menu tableId={tableId} />
    </div>
  );
}

export default App; 