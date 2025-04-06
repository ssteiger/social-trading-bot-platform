import { createFileRoute } from '@tanstack/react-router'

const TermsPage = () => {
  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

      <div className="prose prose-sm">
        <p>Welcome to Social Trading Bots. By using our service, you agree to these terms.</p>

        <h2 className="text-xl font-semibold mt-6 mb-3">1. Acceptance of Terms</h2>
        <p>
          By accessing or using the Social Trading Bots platform, you agree to be bound by these
          Terms of Service and all applicable laws and regulations. If you do not agree with any of
          these terms, you are prohibited from using or accessing this site.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">2. Use License</h2>
        <p>
          Permission is granted to temporarily use the Social Trading Bots platform for personal,
          non-commercial transitory viewing only. This is the grant of a license, not a transfer of
          title.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">3. Disclaimer</h2>
        <p>
          The materials on Social Trading Bots' platform are provided on an 'as is' basis. Social
          Trading Bots makes no warranties, expressed or implied, and hereby disclaims and negates
          all other warranties including, without limitation, implied warranties or conditions of
          merchantability, fitness for a particular purpose, or non-infringement of intellectual
          property or other violation of rights.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">4. Limitations</h2>
        <p>
          In no event shall Social Trading Bots or its suppliers be liable for any damages
          (including, without limitation, damages for loss of data or profit, or due to business
          interruption) arising out of the use or inability to use the materials on Social Trading
          Bots' platform, even if Social Trading Bots or a Social Trading Bots authorized
          representative has been notified orally or in writing of the possibility of such damage.
        </p>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/_app/terms')({
  component: TermsPage,
})
