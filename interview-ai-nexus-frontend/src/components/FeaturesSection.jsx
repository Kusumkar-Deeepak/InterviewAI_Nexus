import { motion } from "framer-motion";

const features = [
  {
    title: "Resume-Driven Questions",
    description:
      "Our AI analyzes candidate resumes to generate relevant, position-specific questions.",
    icon: "📄",
  },
  {
    title: "Behavioral Analysis",
    description:
      "Evaluates verbal and non-verbal cues to assess communication skills and confidence.",
    icon: "👔",
  },
  {
    title: "Advanced Proctoring",
    description:
      "Real-time monitoring for suspicious activity during interviews.",
    icon: "👁️",
  },
  {
    title: "Structured Scoring",
    description:
      "Consistent evaluation criteria for fair candidate comparisons.",
    icon: "📊",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Enterprise-Grade Interview Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Designed for HR professionals and hiring managers who demand accuracy
            and efficiency.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;