-- Add database triggers for automatic notifications

-- Trigger to notify laboratories when new exam request is created
CREATE OR REPLACE FUNCTION notify_exam_request_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := (SELECT current_setting('app.supabase_url') || '/functions/v1/notify-exam-request'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT current_setting('app.service_role_key'))
    ),
    body := jsonb_build_object('record', to_jsonb(NEW))
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER exam_request_created_trigger
  AFTER INSERT ON public.exam_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_exam_request_created();

-- Trigger to notify patient when new quotation is created
CREATE OR REPLACE FUNCTION notify_quotation_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := (SELECT current_setting('app.supabase_url') || '/functions/v1/notify-quotation'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT current_setting('app.service_role_key'))
    ),
    body := jsonb_build_object('record', to_jsonb(NEW))
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER quotation_created_trigger
  AFTER INSERT ON public.quotations
  FOR EACH ROW
  EXECUTE FUNCTION notify_quotation_created();
