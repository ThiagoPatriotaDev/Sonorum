import React from 'react';

export default function Header({ activeTab, onChangeTab, savedCount }) {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand">
          <div className="brand-icon">♪</div>
          <div>
            <div>SONORUM</div>
            <div className="brand-subtitle"></div>
          </div>
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'ensino' ? 'active' : ''}`}
            onClick={() => onChangeTab('ensino')}
          >
            🎸 Instrumentos & Aulas
          </button>
          <button
            className={`nav-tab ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => onChangeTab('editor')}
          >
            🎼 Criar Partitura
          </button>
          <button
            className={`nav-tab ${activeTab === 'minhas' ? 'active' : ''}`}
            onClick={() => onChangeTab('minhas')}
          >
            📁 Minhas Partituras <span className="badge-count">{savedCount}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
