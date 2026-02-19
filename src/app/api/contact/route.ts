import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// POST /api/contact - Envoyer un message de contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, subject, message } = body

    // Validation des données
    if (!email || !subject || !message) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Tous les champs sont requis (email, sujet, message)' 
        },
        { status: 400 }
      )
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Format d\'email invalide' 
        },
        { status: 400 }
      )
    }

    // Utiliser la fonction Supabase pour créer le message avec validation
    const { data: result, error } = await supabaseAdmin.rpc('create_contact_message', {
      p_email: email,
      p_subject: subject,
      p_message: message
    })

    if (error) {
      console.error('Erreur création message:', error)
      return NextResponse.json(
        { 
          success: false,
          error: 'Erreur lors de l\'envoi du message' 
        },
        { status: 500 }
      )
    }

    // Vérifier le résultat de la fonction
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error 
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Message envoyé avec succès!',
      messageId: result.message_id
    })

  } catch (error) {
    console.error('Erreur API contact:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur serveur interne' 
      },
      { status: 500 }
    )
  }
}

// GET /api/contact - Récupérer les messages de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    // Récupérer le token d'authentification
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Créer un client avec le token utilisateur
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Récupérer les messages de l'utilisateur connecté
    const { data: messages, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur récupération messages utilisateur:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ messages })

  } catch (error) {
    console.error('Erreur API GET contact:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 