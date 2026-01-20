import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const hdrs = await headers()
  const host = hdrs.get('host') || 'localhost:3000'
  const proto = hdrs.get('x-forwarded-proto') || 'http'
  const origin = `${proto}://${host}`

  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'Retrôvers API',
      version: '1.0.0',
      description: 'Endpoints para inserir e consultar dados da banda e shows.'
    },
    servers: [
      { url: origin, description: 'Servidor atual' }
    ],
    paths: {
      '/api/auth': {
        post: {
          summary: 'Login para obter token',
          description: 'Recebe usuário e senha e retorna um token JWT.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { username: { type: 'string' }, password: { type: 'string' } },
                  required: ['username','password']
                },
                examples: { exemplo: { value: { username: 'admin', password: 'segredo' } } }
              }
            }
          },
          responses: {
            '200': {
              description: 'Token emitido',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { token: { type: 'string' }, expiresIn: { type: 'integer' } },
                    required: ['token']
                  }
                }
              }
            },
            '401': { description: 'Credenciais inválidas' },
            '400': { description: 'Requisição inválida' }
          }
        }
      },
      '/api/shows': {
        get: {
          summary: 'Listar shows',
          description: 'Lista shows ordenados por data. Use `upcoming=1` para apenas futuros.',
          parameters: [
            {
              name: 'upcoming', in: 'query', required: false,
              schema: { type: 'string' }, example: '1',
              description: 'Filtra para shows futuros quando definido'
            }
          ],
          responses: {
            '200': {
              description: 'Lista de shows',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Show' } }
                }
              }
            }
          }
        },
        post: {
          summary: 'Criar/Atualizar show',
          description: 'Cria ou atualiza um show (usa `id` opcional). Requer Bearer token.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ShowCreate' },
                examples: {
                  exemplo: {
                    value: {
                      id: 'sp-07',
                      venue: 'Meu Lugar',
                      city: 'Cidade/SP',
                      date: '2026-03-01T20:00:00-03:00',
                      image: '/images/meulugar.png',
                      description: 'Show elétrico',
                      link: 'https://maps.app.goo.gl/...',
                      location: { lat: -22.0, lng: -47.0, address: 'Endereço' },
                      postUrl: 'https://www.instagram.com/p/.../'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Show criado/atualizado',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Show' } } }
            },
            '401': { description: 'Não autorizado' },
            '400': { description: 'Dados inválidos' }
          }
        }
      },
      '/api/band': {
        get: {
          summary: 'Ler dados da banda',
          description: 'Retorna o documento principal com dados da banda.',
          responses: {
            '200': {
              description: 'Dados da banda',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Band' } } }
            }
          }
        },
        post: {
          summary: 'Atualizar dados da banda',
          description: 'Atualiza partes do documento principal. Requer Bearer token.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Band' },
                examples: {
                  exemplo: {
                    value: {
                      name: 'Retrôvers',
                      about: { paragraphs: ['Texto 1', 'Texto 2'], generations: [
                        { image: 'https://placehold.co/600x600/0f1317/e5e7eb.png?text=Geracao+1', caption: 'Primeiros anos' }
                      ] },
                      members: [
                        { name: 'Ítalo Varzone', role: 'Guitarra / Vocal', image: '/images/italo.jpeg' }
                      ],
                      formats: {
                        acoustic: 'Ideal para ambientes...',
                        electric: 'Para eventos maiores...'
                      },
                      contact: { whatsapp: '5519991480440', message: 'Olá! Gostaria de mais informações...' },
                      playlists: { apple: 'https://music.apple.com/...' }
                    }
                  }
                }
              }
            }
          },
          responses: {
            '201': { description: 'Banda atualizada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Band' } } } },
            '401': { description: 'Não autorizado' }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http', scheme: 'bearer', bearerFormat: 'JWT'
        }
      },
      schemas: {
        Location: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
            address: { type: 'string' }
          }
        },
        Show: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            venue: { type: 'string' },
            city: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            image: { type: 'string' },
            description: { type: 'string' },
            link: { type: 'string', format: 'uri' },
            location: { $ref: '#/components/schemas/Location' },
            postUrl: { type: 'string', format: 'uri' }
          },
          required: ['id','venue','city','date']
        },
        ShowCreate: {
          allOf: [
            { $ref: '#/components/schemas/Show' },
            { type: 'object', required: ['venue','city','date'] }
          ]
        },
        Member: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            image: { type: 'string' }
          },
          required: ['name','role']
        },
        Formats: {
          type: 'object',
          properties: {
            acoustic: { type: 'string' },
            electric: { type: 'string' }
          }
        },
        Contact: {
          type: 'object',
          properties: {
            whatsapp: { type: 'string', description: 'DDI+DDD+número, ex: 5519991480440' },
            message: { type: 'string' }
          }
        },
        Playlists: {
          type: 'object',
          properties: {
            apple: { type: 'string', format: 'uri' }
          }
        },
        Band: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            about: { type: 'object', properties: {
              paragraphs: { type: 'array', items: { type: 'string' } },
              generations: { type: 'array', items: {
                type: 'object', properties: {
                  image: { type: 'string', format: 'uri' },
                  caption: { type: 'string' }
                }
              } }
            } },
            members: { type: 'array', items: { $ref: '#/components/schemas/Member' } },
            formats: { $ref: '#/components/schemas/Formats' },
            contact: { $ref: '#/components/schemas/Contact' },
            playlists: { $ref: '#/components/schemas/Playlists' }
          },
          required: ['name']
        }
      }
    }
  }

  return NextResponse.json(spec)
}
