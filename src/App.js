import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

function App({ signOut, user }) {
  return (
    <div className="App">
      <header className="App-header">
        <h1>タスティン</h1>
        <button onClick={signOut}>サインアウト</button>
      </header>
      {/* アプリケーションコンテンツ */}
    </div>
  );
}

export default withAuthenticator(App);
