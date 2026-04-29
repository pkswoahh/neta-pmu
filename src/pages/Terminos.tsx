import LegalPage, { LegalSection, LegalText, LegalList } from './Legal'

export default function Terminos() {
  return (
    <LegalPage title="Términos de Servicio" updated="28 de abril de 2026">
      <LegalSection title="1. El servicio">
        <LegalText>
          Neta. es una herramienta de gestión diseñada para micropigmentadoras independientes.
          Te permite registrar procedimientos, gastos y clientes, y visualizar el desempeño
          de tu negocio en un solo lugar.
        </LegalText>
      </LegalSection>

      <LegalSection title="2. Tu cuenta">
        <LegalText>
          Eres responsable de mantener la confidencialidad de tu contraseña y de todas las
          actividades que ocurran bajo tu cuenta. Usa un email válido y datos verídicos al
          registrarte. Si crees que tu cuenta fue comprometida, contáctanos de inmediato.
        </LegalText>
      </LegalSection>

      <LegalSection title="3. Precio y facturación">
        <LegalText>
          El servicio tiene un costo de <strong className="text-primary">$15 USD al mes</strong>.
          Al registrarte tienes un período de prueba gratuito de 14 días, sin necesidad de
          ingresar datos de pago. Al terminar el período de prueba, deberás suscribirte para
          seguir usando la plataforma.
        </LegalText>
      </LegalSection>

      <LegalSection title="4. Cancelación">
        <LegalText>
          Puedes cancelar tu suscripción en cualquier momento desde tu panel de configuración.
          Una vez cancelada, mantendrás acceso hasta el final del período ya pagado. No
          realizamos reembolsos por períodos parciales.
        </LegalText>
      </LegalSection>

      <LegalSection title="5. Uso aceptable">
        <LegalText>Neta. está destinado a uso profesional individual. No está permitido:</LegalText>
        <LegalList items={[
          'Compartir tu cuenta con otras personas.',
          'Revender o redistribuir el servicio.',
          'Usarlo para actividades ilegales o fraudulentas.',
          'Intentar acceder a datos de otras usuarias.',
        ]} />
      </LegalSection>

      <LegalSection title="6. Disponibilidad">
        <LegalText>
          Nos esforzamos por mantener el servicio disponible en todo momento, pero no
          garantizamos disponibilidad ininterrumpida. Avisaremos con anticipación cuando
          programemos mantenimiento que afecte el acceso.
        </LegalText>
      </LegalSection>

      <LegalSection title="7. Limitación de responsabilidad">
        <LegalText>
          Neta. no es responsable por pérdidas derivadas de interrupciones del servicio,
          errores en los datos ingresados por la usuaria, o factores externos ajenos a
          nuestra plataforma. El servicio se provee "tal como está".
        </LegalText>
      </LegalSection>

      <LegalSection title="8. Modificaciones">
        <LegalText>
          Podemos actualizar estos términos en cualquier momento. Te notificaremos por
          email ante cambios importantes. El uso continuado del servicio después de la
          notificación implica aceptación de los nuevos términos.
        </LegalText>
      </LegalSection>

      <LegalSection title="9. Contacto">
        <LegalText>
          ¿Tienes preguntas sobre estos términos? Escríbenos a{' '}
          <a href="mailto:robertocpks24@gmail.com" className="text-accent hover:underline">
            robertocpks24@gmail.com
          </a>
        </LegalText>
      </LegalSection>
    </LegalPage>
  )
}
