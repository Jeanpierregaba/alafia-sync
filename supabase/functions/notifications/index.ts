
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fonction pour envoyer des notifications par email (simulation)
async function sendEmailNotification(userId: string, appointmentId: string, type: 'reminder' | 'confirmation' | 'cancellation') {
  try {
    // Récupérer les informations de l'utilisateur
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select(`
        first_name,
        last_name,
        id,
        auth_users:id(email)
      `)
      .eq('id', userId)
      .single();
      
    if (userError) throw userError;
    
    // Récupérer les détails du rendez-vous
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments_view')
      .select('*')
      .eq('id', appointmentId)
      .single();
      
    if (appointmentError) throw appointmentError;
    
    const email = userData.auth_users?.email;
    if (!email) throw new Error('Email not found for user');
    
    // Construire le contenu de l'email
    let subject = '';
    let content = '';
    
    switch(type) {
      case 'reminder':
        subject = 'Rappel de rendez-vous médical';
        content = `Bonjour ${userData.first_name},\n\nCeci est un rappel pour votre rendez-vous avec ${appointment.practitioner_first_name} ${appointment.practitioner_last_name} le ${new Date(appointment.start_time).toLocaleDateString()} à ${new Date(appointment.start_time).toLocaleTimeString()}.\n\nMerci,\nL'équipe ALAFIA SYNC`;
        break;
      case 'confirmation':
        subject = 'Confirmation de rendez-vous médical';
        content = `Bonjour ${userData.first_name},\n\nVotre rendez-vous avec ${appointment.practitioner_first_name} ${appointment.practitioner_last_name} a bien été confirmé pour le ${new Date(appointment.start_time).toLocaleDateString()} à ${new Date(appointment.start_time).toLocaleTimeString()}.\n\nMerci,\nL'équipe ALAFIA SYNC`;
        break;
      case 'cancellation':
        subject = 'Annulation de rendez-vous médical';
        content = `Bonjour ${userData.first_name},\n\nVotre rendez-vous avec ${appointment.practitioner_first_name} ${appointment.practitioner_last_name} prévu le ${new Date(appointment.start_time).toLocaleDateString()} à ${new Date(appointment.start_time).toLocaleTimeString()} a été annulé.\n\nMerci,\nL'équipe ALAFIA SYNC`;
        break;
    }
    
    console.log(`Sending ${type} email to ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${content}`);
    
    // Enregistrer la notification dans les logs
    const { error: logError } = await supabase
      .from('notification_logs')
      .insert({
        appointment_id: appointmentId,
        notification_type: 'email',
        status: 'sent',
        recipient: email,
        content
      });
      
    if (logError) throw logError;
    
    // Dans une application réelle, ici nous utiliserions un service d'envoi d'emails
    // comme SendGrid, MailGun, etc.
    
    return { success: true, recipient: email };
  } catch (error) {
    console.error('Error sending email notification:', error);
    
    // Enregistrer l'erreur dans les logs
    await supabase
      .from('notification_logs')
      .insert({
        appointment_id: appointmentId,
        notification_type: 'email',
        status: 'failed',
        recipient: userId,
        error: error.message
      });
    
    throw error;
  }
}

// Fonction pour envoyer des notifications par SMS (simulation)
async function sendSmsNotification(userId: string, appointmentId: string, type: 'reminder' | 'confirmation' | 'cancellation') {
  try {
    // Récupérer les préférences de notification de l'utilisateur
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('phone_number')
      .eq('user_id', userId)
      .single();
      
    if (prefError) throw prefError;
    
    const phoneNumber = preferences?.phone_number;
    if (!phoneNumber) throw new Error('Phone number not found for user');
    
    // Récupérer les détails du rendez-vous
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments_view')
      .select('*')
      .eq('id', appointmentId)
      .single();
      
    if (appointmentError) throw appointmentError;
    
    // Construire le contenu du SMS
    let content = '';
    
    switch(type) {
      case 'reminder':
        content = `ALAFIA SYNC: Rappel RDV avec ${appointment.practitioner_first_name} ${appointment.practitioner_last_name} le ${new Date(appointment.start_time).toLocaleDateString()} à ${new Date(appointment.start_time).toLocaleTimeString()}`;
        break;
      case 'confirmation':
        content = `ALAFIA SYNC: RDV confirmé avec ${appointment.practitioner_first_name} ${appointment.practitioner_last_name} le ${new Date(appointment.start_time).toLocaleDateString()} à ${new Date(appointment.start_time).toLocaleTimeString()}`;
        break;
      case 'cancellation':
        content = `ALAFIA SYNC: RDV annulé avec ${appointment.practitioner_first_name} ${appointment.practitioner_last_name} prévu le ${new Date(appointment.start_time).toLocaleDateString()}`;
        break;
    }
    
    console.log(`Sending ${type} SMS to ${phoneNumber}`);
    console.log(`Content: ${content}`);
    
    // Enregistrer la notification dans les logs
    const { error: logError } = await supabase
      .from('notification_logs')
      .insert({
        appointment_id: appointmentId,
        notification_type: 'sms',
        status: 'sent',
        recipient: phoneNumber,
        content
      });
      
    if (logError) throw logError;
    
    // Dans une application réelle, ici nous utiliserions un service d'envoi de SMS
    // comme Twilio, Nexmo, etc.
    
    return { success: true, recipient: phoneNumber };
  } catch (error) {
    console.error('Error sending SMS notification:', error);
    
    // Enregistrer l'erreur dans les logs
    await supabase
      .from('notification_logs')
      .insert({
        appointment_id: appointmentId,
        notification_type: 'sms',
        status: 'failed',
        recipient: userId,
        error: error.message
      });
    
    throw error;
  }
}

// Fonction pour envoyer des notifications WhatsApp (simulation)
async function sendWhatsAppNotification(userId: string, appointmentId: string, type: 'reminder' | 'confirmation' | 'cancellation') {
  try {
    // Récupérer les préférences de notification de l'utilisateur
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('phone_number')
      .eq('user_id', userId)
      .single();
      
    if (prefError) throw prefError;
    
    const phoneNumber = preferences?.phone_number;
    if (!phoneNumber) throw new Error('Phone number not found for user');
    
    // Récupérer les détails du rendez-vous
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments_view')
      .select('*')
      .eq('id', appointmentId)
      .single();
      
    if (appointmentError) throw appointmentError;
    
    // Construire le contenu du message WhatsApp
    let content = '';
    
    switch(type) {
      case 'reminder':
        content = `*Rappel de rendez-vous médical*\n\nBonjour,\n\nCeci est un rappel pour votre rendez-vous avec ${appointment.practitioner_first_name} ${appointment.practitioner_last_name} le ${new Date(appointment.start_time).toLocaleDateString()} à ${new Date(appointment.start_time).toLocaleTimeString()}.\n\nMerci,\nL'équipe ALAFIA SYNC`;
        break;
      case 'confirmation':
        content = `*Confirmation de rendez-vous médical*\n\nBonjour,\n\nVotre rendez-vous avec ${appointment.practitioner_first_name} ${appointment.practitioner_last_name} a bien été confirmé pour le ${new Date(appointment.start_time).toLocaleDateString()} à ${new Date(appointment.start_time).toLocaleTimeString()}.\n\nMerci,\nL'équipe ALAFIA SYNC`;
        break;
      case 'cancellation':
        content = `*Annulation de rendez-vous médical*\n\nBonjour,\n\nVotre rendez-vous avec ${appointment.practitioner_first_name} ${appointment.practitioner_last_name} prévu le ${new Date(appointment.start_time).toLocaleDateString()} à ${new Date(appointment.start_time).toLocaleTimeString()} a été annulé.\n\nMerci,\nL'équipe ALAFIA SYNC`;
        break;
    }
    
    console.log(`Sending ${type} WhatsApp message to ${phoneNumber}`);
    console.log(`Content: ${content}`);
    
    // Enregistrer la notification dans les logs
    const { error: logError } = await supabase
      .from('notification_logs')
      .insert({
        appointment_id: appointmentId,
        notification_type: 'whatsapp',
        status: 'sent',
        recipient: phoneNumber,
        content
      });
      
    if (logError) throw logError;
    
    // Dans une application réelle, ici nous utiliserions l'API WhatsApp Business
    
    return { success: true, recipient: phoneNumber };
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    
    // Enregistrer l'erreur dans les logs
    await supabase
      .from('notification_logs')
      .insert({
        appointment_id: appointmentId,
        notification_type: 'whatsapp',
        status: 'failed',
        recipient: userId,
        error: error.message
      });
    
    throw error;
  }
}

// Fonction principale pour envoyer des notifications
async function sendNotifications(userId: string, appointmentId: string, type: 'reminder' | 'confirmation' | 'cancellation') {
  try {
    // Récupérer les préférences de notification de l'utilisateur
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (prefError) throw prefError;
    
    const results = [];
    
    // Envoyer les notifications selon les préférences
    if (preferences.email_enabled) {
      try {
        const emailResult = await sendEmailNotification(userId, appointmentId, type);
        results.push({ type: 'email', ...emailResult });
      } catch (err) {
        console.error('Email notification failed:', err);
        results.push({ type: 'email', error: err.message });
      }
    }
    
    if (preferences.sms_enabled && preferences.phone_number) {
      try {
        const smsResult = await sendSmsNotification(userId, appointmentId, type);
        results.push({ type: 'sms', ...smsResult });
      } catch (err) {
        console.error('SMS notification failed:', err);
        results.push({ type: 'sms', error: err.message });
      }
    }
    
    if (preferences.whatsapp_enabled && preferences.phone_number) {
      try {
        const whatsappResult = await sendWhatsAppNotification(userId, appointmentId, type);
        results.push({ type: 'whatsapp', ...whatsappResult });
      } catch (err) {
        console.error('WhatsApp notification failed:', err);
        results.push({ type: 'whatsapp', error: err.message });
      }
    }
    
    return { success: true, results };
  } catch (error) {
    console.error('Error sending notifications:', error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  // Gérer les requêtes CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse les données de la requête
    const { appointmentId, type, userId } = await req.json();
    
    if (!appointmentId || !type || !userId) {
      throw new Error('Missing required parameters: appointmentId, type, or userId');
    }
    
    if (!['reminder', 'confirmation', 'cancellation'].includes(type)) {
      throw new Error('Invalid notification type');
    }
    
    const result = await sendNotifications(userId, appointmentId, type);
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    console.error('Error in notifications function:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 400,
    });
  }
});
