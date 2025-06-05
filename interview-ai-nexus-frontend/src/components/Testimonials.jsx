import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "HR Director, TechCorp",
    content: "InterviewAI Nexus reduced our hiring time by 65% while improving candidate quality. The AI-driven insights are remarkably accurate.",
    avatar: "👩‍💼"
  },
  {
    name: "Michael Chen",
    role: "Founder, StartUp Labs",
    content: "As a small team, we couldn't afford biased hiring. This platform gave us enterprise-grade tools at startup-friendly pricing.",
    avatar: "👨‍💻"
  },
  {
    name: "David Rodriguez",
    role: "Talent Acquisition, GlobalSoft",
    content: "The proctoring features caught several cases of candidate impersonation we would have missed otherwise. Game-changing technology.",
    avatar: "🧑‍💼"
  }
];

const Testimonials = () => {
  return (
    <section className="py-20 px-4 bg-indigo-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted by Hiring Leaders</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it - hear from professionals who transformed their hiring
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-4xl mb-4">{testimonial.avatar}</div>
              <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
              <div>
                <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                <p className="text-indigo-600 text-sm">{testimonial.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;