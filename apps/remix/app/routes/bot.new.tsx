import { json, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useState } from "react";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const botData = {
    name: formData.get("name"),
    description: formData.get("description"),
    strategy: formData.get("strategy"),
  };

  // TODO: Add validation and bot creation logic
  return json({ success: true, data: botData });
};

export default function NewBot() {
  const actionData = useActionData<typeof action>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create New Bot</h1>

      {actionData?.success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">
          Bot created successfully!
        </div>
      )}

      <Form method="post" className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Bot Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter bot name"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your bot's purpose and behavior"
          />
        </div>

        <div>
          <label
            htmlFor="strategy"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Battle Strategy
          </label>
          <textarea
            id="strategy"
            name="strategy"
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            placeholder="// Write your bot's battle strategy code here..."
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? "Creating Bot..." : "Create Bot"}
          </button>
        </div>
      </Form>
    </div>
  );
}
