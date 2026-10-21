const Doc = ({ title, children }) => <section className="mx-auto max-w-3xl px-4 py-14"><h1 className="text-4xl font-bold">{title}</h1><div className="mt-6 space-y-4 text-[15px] leading-relaxed text-ink/90 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold">{children}</div></section>;

export const Privacy = () => (
  <Doc title="Privacy policy">
    <p>This policy explains what personal data Zuno handles and why. Zuno is a platform used by businesses ("merchants") to sell to their own customers.</p>
    <h2>What we collect</h2>
    <p>From merchants: name, email, phone, business details, and records you create in Zuno such as products, orders, sales, customers and suppliers. From a merchant's customers: the name, email, phone and delivery address they enter at checkout, and order details. Payments are processed by Paystack. Zuno never sees or stores card numbers or CVVs.</p>
    <h2>How we use it</h2>
    <p>To run your account and store, process orders and payments, send service emails (verification, password resets, receipts of important changes), prevent fraud and abuse, provide support, and keep security and audit records.</p>
    <h2>Who sees it</h2>
    <p>A merchant can only see their own business data. Customer details entered at a merchant's store are available to that merchant. Authorised Zuno staff may access account data to provide support, and their actions are recorded. We share data with service providers needed to operate Zuno (hosting, database, email, payments) and where the law requires.</p>
    <h2>Retention and your rights</h2>
    <p>We keep business records while an account exists and for as long as needed for legal, accounting and security reasons. Suspending or expiring an account does not delete data. You may ask to access, correct or delete your personal data by contacting support, subject to legal retention duties under applicable Nigerian data-protection law.</p>
    <h2>Security</h2>
    <p>Passwords are hashed, sensitive tokens are stored hashed, and access is restricted by role. No system is perfectly secure; report suspected issues through support.</p>
    <p className="text-sm text-muted">This is a plain-language template. It should be reviewed by a qualified lawyer before launch.</p>
  </Doc>
);

export const Terms = () => (
  <Doc title="Terms of service">
    <p>By creating a Zuno account you agree to these terms.</p>
    <h2>The service</h2>
    <p>Zuno provides tools for an online storefront, point of sale, inventory and business management. Features depend on your plan. We may improve or change features and will not advertise features that are not available.</p>
    <h2>Fees</h2>
    <p>Each plan has a one-time setup fee and a monthly subscription, shown in naira on the pricing page. They are separate payments. If a monthly payment is missed there is a grace period, after which access to paid features pauses. We do not delete your data automatically when access pauses. A branded mobile app is a separate service with its own written quotation and is never charged without your approval.</p>
    <h2>Your responsibilities</h2>
    <p>Keep your credentials secure, provide accurate information, and follow the law, including consumer protection and tax rules, in how you sell. You are responsible for the products you list, your orders and your customers' data.</p>
    <h2>Payments</h2>
    <p>Online payments are processed by Paystack under its own terms. An order or subscription is treated as paid only after the payment is verified with Paystack.</p>
    <h2>Suspension</h2>
    <p>We may suspend a business for non-payment, suspected fraud, or breach of these terms, with a recorded reason. Suspension does not delete data.</p>
    <h2>Liability</h2>
    <p>To the extent permitted by law, Zuno is provided "as is" and our liability is limited to the fees you paid in the preceding three months.</p>
    <p className="text-sm text-muted">This is a plain-language template. It should be reviewed by a qualified lawyer before launch.</p>
  </Doc>
);
