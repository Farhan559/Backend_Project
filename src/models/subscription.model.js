import { channel } from 'diagnostics_channel';
import mognoose , {Schema} from 'mongoose';

const subscriptionSchema = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId, //one who scribering
        ref: "User"
    },
    channel:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true});




export const Subscription = mognoose.model("Subscription",
    subscriptionSchema)