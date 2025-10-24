import React, { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
  Input,
  DatePicker,
  Checkbox,
  Select,
  SelectItem,
} from "@heroui/react";

export default function NodeDrawer({ type, isOpen, onOpenChange, onSubmit, defaultValues = {}, motherOptions = [] }) {
  const [form, setForm] = useState(defaultValues);

  useEffect(() => {
    setForm(defaultValues);
  }, [defaultValues]);

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleSubmit = () => {
    onSubmit(form);
    onOpenChange(false); // close drawer
  };

  const inputs = type === "parent"
    ? [
        { name: "fatherName", label: "Father Name", type: "text" },
        { name: "motherName", label: "Mother Name", type: "text" },
      ]
    : [
        { name: "firstName", label: "First Name", type: "text" },
        { name: "lastName", label: "Last Name", type: "text" },
        { name: "gender", label: "Gender", type: "select", options: [{ key: "male", label: "Male" }, { key: "female", label: "Female" }] },
        { name: "dob", label: "Date of Birth", type: "date" },
        { name: "placeOfBirth", label: "Place of Birth", type: "text" },
        { name: "alive", label: "Still Alive", type: "checkbox" },
        { name: "email", label: "Email", type: "text" },
        { name: "phone", label: "Phone", type: "text" },
        { name: "career", label: "Career", type: "text" },
        ...(type === "child" ? [{ name: "motherId", label: "Select Mother", type: "select", options: motherOptions }] : []),
      ];

  return (
    <Drawer isOpen={isOpen} onOpenChange={onOpenChange} backdrop="opaque">
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader>{type === "parent" ? "Add Parents" : type === "child" ? "Add Child" : "Add Spouse"}</DrawerHeader>
            <DrawerBody className="flex flex-col gap-3">
              {inputs.map((field) => {
                switch (field.type) {
                  case "text":
                  case "email":
                    return (
                      <Input
                        key={field.name}
                        label={field.label}
                        type={field.type}
                        value={form[field.name] || ""}
                        onValueChange={(val) => handleChange(field.name, val)}
                      />
                    );
                  case "date":
                    return (
                      <DatePicker
                        key={field.name}
                        label={field.label}
                        value={form[field.name] || null}
                        onValueChange={(val) => handleChange(field.name, val)}
                      />
                    );
                  case "checkbox":
                    return (
                      <Checkbox
                        key={field.name}
                        defaultSelected={form[field.name] || false}
                        onChange={(val) => handleChange(field.name, val)}
                      >
                        {field.label}
                      </Checkbox>
                    );
                  case "select":
                    return (
                      <Select key={field.name} label={field.label} value={form[field.name] || ""} onValueChange={(val) => handleChange(field.name, val)}>
                        {field.options?.map((opt) => (
                          <SelectItem key={opt.key} value={opt.key}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </Select>
                    );
                  default:
                    return null;
                }
              })}
            </DrawerBody>
            <DrawerFooter className="flex gap-2">
              <Button color="danger" variant="flat" onPress={() => onOpenChange(false)}>Cancel</Button>
              <Button color="primary" onPress={handleSubmit}>Save</Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
