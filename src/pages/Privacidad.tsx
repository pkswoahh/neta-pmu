import LegalPage, { LegalSection, LegalText, LegalList } from './Legal'

export default function Privacidad() {
  return (
    <LegalPage title="Política de Privacidad" updated="28 de abril de 2026">
      <LegalSection title="1. Qué datos recopilamos">
        <LegalText>Al usar Neta. recopilamos la información que tú misma ingresas:</LegalText>
        <LegalList items={[
          'Tu email y contraseña (para autenticarte).',
          'El nombre de tu negocio, moneda preferida y meta mensual de ingresos.',
          'Los procedimientos, gastos y clientes que registras.',
          'Información técnica básica: país de acceso y fecha de última sesión activa.',
        ]} />
      </LegalSection>

      <LegalSection title="2. Cómo usamos tus datos">
        <LegalText>
          Usamos tus datos exclusivamente para brindarte el servicio de Neta. No vendemos,
          compartimos ni monetizamos tu información con terceros para fines publicitarios
          ni de ningún otro tipo.
        </LegalText>
      </LegalSection>

      <LegalSection title="3. Proveedores con acceso a tus datos">
        <LegalText>
          Trabajamos con los siguientes proveedores para operar el servicio:
        </LegalText>
        <LegalList items={[
          'Supabase: almacenamiento de datos y autenticación. Tus datos se guardan en servidores cifrados en la nube.',
          'Proveedor de pagos (Stripe): procesa tu suscripción. Solo accede a información de facturación.',
          'Netlify: hospeda la aplicación web. No accede a tus datos de negocio.',
        ]} />
      </LegalSection>

      <LegalSection title="4. Seguridad">
        <LegalText>
          Toda la comunicación entre tu dispositivo y nuestros servidores está cifrada con
          HTTPS. Los datos en reposo están protegidos por las medidas de seguridad de
          Supabase, que incluyen cifrado a nivel de base de datos y control de acceso
          por fila (RLS).
        </LegalText>
      </LegalSection>

      <LegalSection title="5. Retención de datos">
        <LegalText>
          Conservamos tus datos mientras tu cuenta esté activa. Si cancelas y no vuelves
          a ingresar, eliminaremos tus datos dentro de los 30 días posteriores al
          vencimiento de tu cuenta.
        </LegalText>
      </LegalSection>

      <LegalSection title="6. Tus derechos">
        <LegalText>Puedes solicitar en cualquier momento:</LegalText>
        <LegalList items={[
          'Una exportación de todos tus datos en formato CSV.',
          'La eliminación definitiva de tu cuenta y toda tu información.',
          'Corrección de datos incorrectos asociados a tu perfil.',
        ]} />
        <LegalText>
          Para ejercer cualquiera de estos derechos, escríbenos a{' '}
          <a href="mailto:robertocpks24@gmail.com" className="text-accent hover:underline">
            robertocpks24@gmail.com
          </a>{' '}
          y respondemos en un plazo máximo de 5 días hábiles.
        </LegalText>
      </LegalSection>

      <LegalSection title="7. Cookies">
        <LegalText>
          Neta. usa cookies técnicas necesarias para mantener tu sesión iniciada. No
          usamos cookies de rastreo ni publicidad de terceros.
        </LegalText>
      </LegalSection>

      <LegalSection title="8. Cambios a esta política">
        <LegalText>
          Si realizamos cambios importantes, te avisaremos por email antes de que entren
          en vigor. Puedes consultar la versión actualizada en esta misma página en cualquier
          momento.
        </LegalText>
      </LegalSection>

      <LegalSection title="9. Contacto">
        <LegalText>
          ¿Preguntas sobre privacidad o protección de datos? Escríbenos a{' '}
          <a href="mailto:robertocpks24@gmail.com" className="text-accent hover:underline">
            robertocpks24@gmail.com
          </a>
        </LegalText>
      </LegalSection>
    </LegalPage>
  )
}
