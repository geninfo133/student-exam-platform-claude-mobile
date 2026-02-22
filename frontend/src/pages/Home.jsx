import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ORG_TYPES = [
  {
    key: 'school',
    title: 'School',
    description: 'K-12 schools with class & section management',
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
  },
  {
    key: 'college',
    title: 'College',
    description: 'Higher education institutions',
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    key: 'coaching',
    title: 'Coaching Centre',
    description: 'Competitive exam preparation (EAMCET, NEET, JEE...)',
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
];

export default function Home() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);

  if (user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome back!</h1>
          <Link
            to="/dashboard"
            className="inline-block bg-indigo-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-2">
          Welcome
        </h1>
        <p className="text-center text-gray-500 mb-10">
          {selected ? 'Login to your account or create a new one' : 'Select your organization type to get started'}
        </p>

        {!selected ? (
          /* Step 1: Pick org type */
          <div className="grid md:grid-cols-3 gap-6">
            {ORG_TYPES.map((org) => (
              <button
                key={org.key}
                onClick={() => setSelected(org.key)}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl hover:scale-[1.03] transition-all p-8 flex flex-col items-center text-center cursor-pointer border-2 border-transparent hover:border-indigo-500"
              >
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                  {org.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">{org.title}</h3>
                <p className="text-gray-500 text-sm">{org.description}</p>
              </button>
            ))}
          </div>
        ) : (
          /* Step 2: Login or Register */
          <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
            <Link
              to={`/login?org_type=${selected}`}
              className="w-full py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition text-center"
            >
              Login
            </Link>
            <Link
              to={`/register?org_type=${selected}`}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition text-center"
            >
              Register
            </Link>
            <button
              onClick={() => setSelected(null)}
              className="mt-2 text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
