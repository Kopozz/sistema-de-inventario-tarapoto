import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para que el siguiente renderizado muestre la UI alternativa.
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // También puedes registrar el error en un servicio de reporte de errores
    console.error("Uncaught error:", error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      // Puedes renderizar cualquier UI personalizada de repuesto
      return (
        <div style={{ padding: '2rem', background: '#1a1c29', color: 'white', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h1>⚠️ Algo salió mal.</h1>
          <p>La aplicación ha encontrado un error crítico.</p>
          <details style={{ whiteSpace: 'pre-wrap', background: '#2a2d3e', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#f97316', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}
          >
            Recargar Página
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
