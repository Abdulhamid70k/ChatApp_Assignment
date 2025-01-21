import bcrypt from "bcrypt";

export function addPasswordHooks(schema) {
    schema.pre('save', async function (next) {
        if (!this.isModified('password')) return next();

        try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
            next();
        } catch (error) {
            next(error);
        }
    });

    schema.methods.comparePassword = async function (candidatePassword) {
        return bcrypt.compare(candidatePassword, this.password);
    };
  
}