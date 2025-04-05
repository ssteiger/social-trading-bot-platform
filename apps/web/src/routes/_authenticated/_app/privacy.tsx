import { createFileRoute } from "@tanstack/react-router";

const PrivacyPage = () => {
	return (
		<div className="container max-w-3xl py-10">
			<h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

			<div className="prose prose-sm">
				<p>
					At Social Trading Bots, we take your privacy seriously. This Privacy
					Policy explains how we collect, use, disclose, and safeguard your
					information when you use our platform.
				</p>

				<h2 className="text-xl font-semibold mt-6 mb-3">
					1. Information We Collect
				</h2>
				<p>
					We may collect personal information that you voluntarily provide to us
					when you register on the platform, express interest in obtaining
					information about us or our products and services, or otherwise
					contact us.
				</p>

				<h2 className="text-xl font-semibold mt-6 mb-3">
					2. How We Use Your Information
				</h2>
				<p>
					We use the information we collect to provide, maintain, and improve
					our services, to develop new ones, and to protect our platform and our
					users.
				</p>

				<h2 className="text-xl font-semibold mt-6 mb-3">
					3. Disclosure of Your Information
				</h2>
				<p>
					We may share information we have collected about you in certain
					situations. Your information may be disclosed as follows:
				</p>
				<ul className="list-disc pl-5 mt-2">
					<li>By Law or to Protect Rights</li>
					<li>Third-Party Service Providers</li>
					<li>Marketing Communications</li>
					<li>Interactions with Other Users</li>
				</ul>

				<h2 className="text-xl font-semibold mt-6 mb-3">
					4. Security of Your Information
				</h2>
				<p>
					We use administrative, technical, and physical security measures to
					help protect your personal information. While we have taken reasonable
					steps to secure the personal information you provide to us, please be
					aware that despite our efforts, no security measures are perfect or
					impenetrable.
				</p>
			</div>
		</div>
	);
}

export const Route = createFileRoute("/_authenticated/_app/privacy")({
	component: PrivacyPage,
});