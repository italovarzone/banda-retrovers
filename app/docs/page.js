'use client'

import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import './swagger-light.css'

export default function DocsPage(){
  return (
    <main className="docs-light" style={{padding:'1rem'}}>
      <h1 style={{marginBottom:'1rem'}}>API Docs</h1>
      <SwaggerUI url="/api/openapi" docExpansion="list" defaultModelsExpandDepth={1} defaultModelExpandDepth={1} />
    </main>
  )
}
