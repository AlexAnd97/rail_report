import React from 'react'
import ReactDOM from 'react-dom/client'
import { ReportPage } from './pages/ReportPage'
import { TokenPreview } from './components/TokenPreview'
import './index.css'

const showTokens = new URLSearchParams(window.location.search).get('tokens') === '1'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {showTokens ? <TokenPreview /> : <ReportPage />}
  </React.StrictMode>
)
